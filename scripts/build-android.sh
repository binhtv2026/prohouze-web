#!/bin/bash
# =====================================================
# ProHouzing — Android Build & Submit Script
# C7: Google Play Console | C9: AAB Upload
# Run from: frontend/ directory
# =====================================================

set -e
echo "🤖 ProHouzing Android Build Pipeline"
echo "======================================="

APP_VERSION="2.1.0"
BUILD_NUM="21001"
ANDROID_DIR="android"
AAB_OUTPUT="android/app/build/outputs/bundle/release/app-release.aab"

# ── 1. Build web ───────────────────────────────────────────────────────────────
echo "📦 Building React app..."
REACT_APP_BACKEND_URL=https://api.prohouzing.com \
REACT_APP_ENV=production \
npm run build

# ── 2. Sync to Android ────────────────────────────────────────────────────────
echo "📲 Syncing to Android..."
npx cap copy android
npx cap sync android

# ── 3. Build AAB (Android App Bundle — required for Play Store) ───────────────
echo "🔨 Building AAB..."
cd $ANDROID_DIR
./gradlew bundleRelease \
  -PversionName="$APP_VERSION" \
  -PversionCode="$BUILD_NUM" \
  --no-daemon \
  --stacktrace 2>&1 | grep -E "BUILD|error:|FAILED|SUCCESS"
cd ..

# ── 4. Sign AAB ───────────────────────────────────────────────────────────────
KEYSTORE="${KEYSTORE_PATH:-android/prohouzing-release.keystore}"
ALIAS="${KEY_ALIAS:-prohouzing}"

if [ -f "$KEYSTORE" ]; then
  echo "🔏 Signing AAB..."
  jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -storepass "${KEYSTORE_PASS:-}" \
    -keystore "$KEYSTORE" \
    "$AAB_OUTPUT" \
    "$ALIAS" \
    2>&1 | grep -E "jar signed|Warning"
else
  echo "⚠️  Keystore not found at $KEYSTORE"
  echo "   Create with: keytool -genkey -v -keystore android/prohouzing-release.keystore"
  echo "   -alias prohouzing -keyalg RSA -keysize 2048 -validity 10000"
fi

# ── 5. Upload to Google Play (Internal Track) ─────────────────────────────────
echo "🚀 Uploading to Google Play..."
if command -v bundletool &>/dev/null; then
  bundletool validate --bundle="$AAB_OUTPUT"
  echo "✅ AAB is valid"
fi

echo ""
echo "✅ Android Build Complete!"
echo "   Version: $APP_VERSION ($BUILD_NUM)"
echo "   AAB: $AAB_OUTPUT"
echo ""
echo "📋 Upload thủ công lên Google Play Console:"
echo "   1. play.google.com/console"
echo "   2. ProHouzing > Phát hành > Internal Testing"
echo "   3. Tạo bản phát hành mới > Upload AAB"
echo "   4. Save > Review > Rollout"
echo ""
echo "   Hoặc dùng Fastlane Supply:"
echo "   fastlane supply --aab $AAB_OUTPUT --track internal"
