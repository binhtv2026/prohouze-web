#!/bin/bash
# =====================================================
# ProHouzing — App Store Submission Checklist
# C10: Final validation trước khi submit
# =====================================================

echo ""
echo "🏪 ProHouzing — App Store Submission Checklist"
echo "================================================"
echo ""

PASS=0
FAIL=0
WARN=0

check() {
  local label="$1"
  local condition="$2"
  local hint="$3"
  if eval "$condition"; then
    echo "  ✅ $label"
    ((PASS++)) || true
  else
    echo "  ❌ $label"
    [ -n "$hint" ] && echo "     → $hint"
    ((FAIL++)) || true
  fi
}

warn() {
  local label="$1"
  local hint="$2"
  echo "  ⚠️  $label"
  [ -n "$hint" ] && echo "     → $hint"
  ((WARN++)) || true
}

echo "── 1. Build & Bundle ─────────────────────────────────"
check "React build tồn tại" "[ -d 'frontend/build' ]" "npm run build trong frontend/"
check "iOS project tồn tại" "[ -d 'frontend/ios/App' ]" "npx cap add ios"
check "Android project tồn tại" "[ -d 'frontend/android' ]" "npx cap add android"
check "capacitor.config.json hợp lệ" "python3 -c \"import json; json.load(open('frontend/capacitor.config.json'))\" 2>/dev/null" "Kiểm tra JSON syntax"
check "Privacy Policy tồn tại" "[ -f 'PRIVACY_POLICY.md' ]" ""
check "build-ios.sh executable" "[ -x 'scripts/build-ios.sh' ]" "chmod +x scripts/build-ios.sh"
check "build-android.sh executable" "[ -x 'scripts/build-android.sh' ]" "chmod +x scripts/build-android.sh"

echo ""
echo "── 2. App Identity ────────────────────────────────────"
BUNDLE_ID=$(python3 -c "import json; d=json.load(open('frontend/capacitor.config.json')); print(d.get('appId',''))" 2>/dev/null)
check "Bundle ID đúng (com.prohouzing.app)" "[ '$BUNDLE_ID' = 'com.prohouzing.app' ]" "Kiểm tra capacitor.config.json"

APP_NAME=$(python3 -c "import json; d=json.load(open('frontend/capacitor.config.json')); print(d.get('appName',''))" 2>/dev/null)
check "App name đúng (ProHouzing)" "[ '$APP_NAME' = 'ProHouzing' ]" ""

echo ""
echo "── 3. Code & Dependencies ─────────────────────────────"
check "package.json tồn tại" "[ -f 'frontend/package.json' ]" ""
check "node_modules tồn tại" "[ -d 'frontend/node_modules' ]" "npm install"
check "No console.error trong src" "! grep -r 'console.error' frontend/src/ --include='*.js' --include='*.jsx' -q 2>/dev/null" "Xóa console.error trước khi submit"

warn "Kiểm tra CocoaPods" "cd frontend && pod install --project-directory=ios/App"
warn "Kiểm tra Android SDK" "Đảm bảo ANDROID_SDK_ROOT đã được set"

echo ""
echo "── 4. App Store Requirements ─────────────────────────"
warn "Screenshots chưa tạo tự động" "Chạy: node scripts/screenshot-meta.js và chụp thủ công"
warn "App Icon 1024x1024" "Cần file icon 1024x1024px .png trong Xcode Assets.xcassets"
warn "App Description (VI+EN)" "Điền trong App Store Connect > App Information"
warn "Category: Business" "Chọn trong App Store Connect"
warn "Age Rating: 4+" "Không có content người lớn"
warn "Encryption: Không dùng mã hoá custom" "Tick 'No' trong Compliance"

echo ""
echo "── 5. Google Play Requirements ───────────────────────"
warn "AAB phải được sign với keystore" "Tạo keystore: xem scripts/build-android.sh"
warn "Target SDK 34" "Đã config trong capacitor.config.json"
warn "App category: Productivity/Business" "Chọn trong Play Console"
warn "Data Safety form" "Điền form trong Play Console > Policy"

echo ""
echo "── 6. TestFlight / Internal Test ─────────────────────"
warn "TestFlight: Thêm email team vào Internal Testers" "appstoreconnect.apple.com"
warn "Google Play: Thêm email team vào Internal Track" "play.google.com/console"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  PASSED: $PASS | FAILED: $FAIL | WARNINGS: $WARN"
echo ""
[ $FAIL -gt 0 ] && echo "  ❌ Sửa $FAIL lỗi trước khi submit!" || echo "  ✅ Sẵn sàng submit!"
echo ""

chmod +x scripts/build-ios.sh scripts/build-android.sh 2>/dev/null || true
