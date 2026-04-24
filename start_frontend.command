#!/bin/bash
# ProHouzing Frontend Starter - Double-click để chạy!

cd "$(dirname "$0")/frontend"

echo "======================================"
echo "  ProHouzing Frontend - Khởi động"
echo "======================================"
echo ""
echo "🌐 Sẽ chạy tại: http://localhost:3000"
echo ""

# Tìm yarn hoặc npm
if command -v yarn &>/dev/null; then
  echo "✅ Dùng yarn..."
  yarn start
elif command -v npm &>/dev/null; then
  echo "✅ Dùng npm..."
  npm start
else
  echo "❌ Chưa cài Node.js! Cài tại: https://nodejs.org"
  read -p "Nhấn Enter để đóng..."
  exit 1
fi
