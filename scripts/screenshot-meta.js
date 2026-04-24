#!/usr/bin/env node
/**
 * screenshot-meta.js — C4
 * Metadata và hướng dẫn chụp screenshots cho App Store + Google Play
 * 
 * Tool dùng: Simulator (Xcode) hoặc thiết bị thật
 * Run: node scripts/screenshot-meta.js
 */

const SCREENSHOTS = {
  // App Store: 3 kích thước bắt buộc
  appStore: [
    {
      device: "iPhone 15 Pro Max",
      size: "1290x2796",
      suffix: "iphone-6.7",
      needed: 6,
    },
    {
      device: "iPad Pro 12.9\" (6th gen)",
      size: "2064x2752",
      suffix: "ipad-12.9",
      needed: 6,
    },
    {
      device: "iPhone 8 Plus (optional)",
      size: "1242x2208",
      suffix: "iphone-5.5",
      needed: 6,
    },
  ],
  // Google Play: 2 kích thước bắt buộc
  googlePlay: [
    {
      device: "Phone (portrait)",
      size: "1080x1920",
      suffix: "phone",
      needed: 4,
    },
    {
      device: "Tablet 7\"",
      size: "1200x1920",
      suffix: "tablet",
      needed: 4,
    },
  ],
};

const SCREENSHOT_SEQUENCE = [
  {
    order: 1,
    screen: "Màn hình đăng nhập",
    route: "/login",
    caption_vi: "Đăng nhập an toàn — Dành riêng cho chuyên viên BĐS",
    caption_en: "Secure Login — Purpose-built for real estate professionals",
    key_elements: ["Logo ProHouzing", "Form đăng nhập", "Background gradient"],
  },
  {
    order: 2,
    screen: "Chọn Module",
    route: "/select-module",
    caption_vi: "3 phân khúc chuyên biệt: Sơ cấp, Thứ cấp, Cho thuê",
    caption_en: "3 specialized tracks: Primary, Secondary & Leasing",
    key_elements: ["3 cards gradient", "Role-based access"],
  },
  {
    order: 3,
    screen: "Sales Dashboard (Sơ cấp)",
    route: "/sales",
    caption_vi: "Dashboard real-time — Kiểm soát toàn bộ pipeline",
    caption_en: "Real-time Dashboard — Full pipeline control at a glance",
    key_elements: ["KPI cards", "Deal pipeline", "Leaderboard"],
  },
  {
    order: 4,
    screen: "Sàn căn hộ (Floor Plan)",
    route: "/sales/floor-plan",
    caption_vi: "Sàn căn hộ interactive — Chốt deal ngay trên tầng",
    caption_en: "Interactive Floor Plan — Close deals right on the floor",
    key_elements: ["Floor grid", "Màu trạng thái", "Filter dự án"],
  },
  {
    order: 5,
    screen: "Training Hub",
    route: "/hrm/training-hub",
    caption_vi: "Đào tạo toàn diện — Từ văn hóa đến chuyên môn",
    caption_en: "Complete Training Hub — From culture to expertise",
    key_elements: ["4 tab", "Progress bars", "Course cards"],
  },
  {
    order: 6,
    screen: "Thi đua KPI",
    route: "/hrm/competition",
    caption_vi: "Bảng xếp hạng realtime — Cạnh tranh lành mạnh",
    caption_en: "Live Leaderboard — Healthy competition drives results",
    key_elements: ["Top 3 podium", "KPI bars", "Huy hiệu"],
  },
];

// Print instructions
console.log("\n🎬 ProHouzing — Screenshot Guide\n");
console.log("═".repeat(50));

console.log("\n📱 App Store Sizes:");
SCREENSHOTS.appStore.forEach(d => {
  console.log(`  [${d.device}] ${d.size} — ${d.needed} screenshots`);
});

console.log("\n📱 Google Play Sizes:");
SCREENSHOTS.googlePlay.forEach(d => {
  console.log(`  [${d.device}] ${d.size} — ${d.needed} screenshots`);
});

console.log("\n📋 Thứ tự chụp (mỗi device):");
SCREENSHOT_SEQUENCE.forEach(s => {
  console.log(`\n  ${s.order}. ${s.screen}`);
  console.log(`     Route: ${s.route}`);
  console.log(`     VI: ${s.caption_vi}`);
  console.log(`     EN: ${s.caption_en}`);
  console.log(`     Elements: ${s.key_elements.join(', ')}`);
});

console.log("\n\n🛠️  Cách chụp trên Simulator (Xcode):");
console.log("  1. Xcode > Devices and Simulators");
console.log("  2. Chọn iPhone 15 Pro Max hoặc iPad Pro 12.9\"");
console.log("  3. Chạy app: npx cap run ios");
console.log("  4. Navigate đến từng màn hình theo thứ tự trên");
console.log("  5. Cmd+S để chụp screenshot");
console.log("  6. File được lưu vào ~/Desktop\n");

console.log("🛠️  Cách chụp trên thiết bị thật:");
console.log("  - iPhone: Volume Up + Side button cùng lúc");
console.log("  - iPad:   Volume Up + Top button cùng lúc\n");

console.log("📤 Upload lên App Store Connect:");
console.log("  appstoreconnect.apple.com > ProHouzing > Screenshots");
console.log("  Kéo thả file PNG vào từng slot\n");

console.log("📤 Upload lên Google Play:");
console.log("  play.google.com/console > Store listing > Screenshots\n");

// Export metadata JSON
const fs = require('fs');
fs.writeFileSync(
  'scripts/screenshot-metadata.json',
  JSON.stringify({ screenshots: SCREENSHOT_SEQUENCE, sizes: SCREENSHOTS }, null, 2)
);
console.log("✅ Đã tạo screenshot-metadata.json\n");
