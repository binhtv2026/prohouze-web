#!/bin/bash
# ═══════════════════════════════════════════════════════
# ProHouzing — iOS Dev Environment Starter
# Double-click file này để khởi động đầy đủ môi trường
# ═══════════════════════════════════════════════════════

# Fix UTF-8 cho CocoaPods (cần thiết vì path có ký tự tiếng Việt)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/frontend"

echo "╔══════════════════════════════════════════╗"
echo "║   ProHouzing iOS Dev Starter v2.1.0     ║"
echo "╚══════════════════════════════════════════╝"

# ── 1. Detect IP hiện tại của Mac ────────────────────
CURRENT_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo ""
echo "📍 IP hiện tại của Mac: $CURRENT_IP"

# ── 2. Cập nhật capacitor.config.json ────────────────
CAP_CONFIG="capacitor.config.json"
if [[ -f "$CAP_CONFIG" ]]; then
  sed -i '' "s|\"url\": \"http://[0-9.]*:[0-9]*\"|\"url\": \"http://$CURRENT_IP:3000\"|g" "$CAP_CONFIG"
  echo "✅ capacitor.config.json → url: http://$CURRENT_IP:3000"
fi

# ── 3. Copy web assets → iOS (không chạy pod install) ─
echo ""
echo "🔄 Copying assets → iOS..."
npx cap copy ios 2>&1 | grep -E "✔|✖|error"
echo "✅ Assets copied"

# ── 4. Mở Xcode ──────────────────────────────────────
echo ""
echo "🍎 Mở Xcode → nhấn ▶ để chạy Simulator..."
npx cap open ios &
sleep 2

# ── 5. Khởi động React dev server ────────────────────
echo ""
echo "🚀 Khởi động React dev server tại port 3000..."
echo "   Simulator sẽ load từ: http://$CURRENT_IP:3000"
echo ""
echo "⚠️  Để dừng: nhấn Ctrl+C trong terminal này"
echo "════════════════════════════════════════════"
PORT=3000 npm start
