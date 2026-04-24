#!/bin/bash
# =====================================================
# ProHouzing — iOS Build & Submit Script
# C6: TestFlight Upload | C8: App Store Submission
# Run from: frontend/ directory
# =====================================================

set -e
echo "🏗️  ProHouzing iOS Build Pipeline"
echo "======================================"

# ── 0. Config ──────────────────────────────────────────────────────────────────
APP_VERSION="2.1.0"
BUILD_NUM="21001"
SCHEME="App"
WORKSPACE="ios/App/App.xcworkspace"
EXPORT_PLIST="ios/ExportOptions.plist"
ARCHIVE_PATH="build/ios/ProHouzing.xcarchive"
IPA_PATH="build/ios/ipa"

# ── 1. Build web assets ────────────────────────────────────────────────────────
echo "📦 Building React app..."
REACT_APP_BACKEND_URL=https://api.prohouzing.com \
REACT_APP_ENV=production \
npm run build

# ── 2. Sync to iOS ────────────────────────────────────────────────────────────
echo "📲 Syncing to iOS..."
npx cap copy ios
npx cap sync ios --inline

# ── 3. Update version in Xcode project ────────────────────────────────────────
echo "🔢 Setting version $APP_VERSION ($BUILD_NUM)..."
xcrun agvtool new-marketing-version $APP_VERSION 2>/dev/null || true
xcrun agvtool new-version -all $BUILD_NUM 2>/dev/null || true

# ── 4. Archive ─────────────────────────────────────────────────────────────────
echo "📁 Archiving..."
mkdir -p build/ios
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="${APPLE_TEAM_ID:-}" \
  | grep -E "error:|warning:|Archive Succeeded|Build Succeeded"

# ── 5. Export IPA ─────────────────────────────────────────────────────────────
echo "📤 Exporting IPA..."
cat > $EXPORT_PLIST << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
</dict>
</plist>
PLIST

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -exportPath "$IPA_PATH" \
  | grep -E "error:|Export Succeeded"

# ── 6. Upload to App Store Connect (TestFlight / App Store) ──────────────────
echo "🚀 Uploading to App Store Connect..."
IPA_FILE=$(find "$IPA_PATH" -name "*.ipa" | head -1)

if [ -z "$IPA_FILE" ]; then
  echo "❌ IPA file not found in $IPA_PATH"
  exit 1
fi

xcrun altool --upload-app \
  --type ios \
  --file "$IPA_FILE" \
  --apiKey "${ASC_KEY_ID:-}" \
  --apiIssuer "${ASC_ISSUER_ID:-}" \
  --show-progress \
  || echo "⚠️  altool upload: check credentials in .env.store"

echo ""
echo "✅ iOS Build Complete!"
echo "   Version: $APP_VERSION ($BUILD_NUM)"
echo "   IPA: $IPA_FILE"
echo "   → Check TestFlight in App Store Connect"
echo ""
echo "📋 Next steps:"
echo "   1. Mở appstoreconnect.apple.com"
echo "   2. Vào ProHouzing > TestFlight"
echo "   3. Thêm Internal Testers (team email)"
echo "   4. Submit for App Store Review khi sẵn sàng"
