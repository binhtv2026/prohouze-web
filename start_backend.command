#!/bin/bash
# ProHouzing Backend Starter v2 - Double-click để chạy!
# Dùng Python CLT binary đã xác nhận hoạt động

cd "$(dirname "$0")/backend"

export PYTHONPATH="/Users/binhtv/Library/Python/3.9/lib/python/site-packages:$PYTHONPATH"
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

PYTHON="/Library/Developer/CommandLineTools/usr/bin/python3.9"

echo "======================================"
echo "  ProHouzing Backend v3.0 - Khởi động"
echo "======================================"
echo ""

# Kiểm tra PostgreSQL
echo "📡 Kiểm tra PostgreSQL..."
if /Applications/Postgres.app/Contents/Versions/latest/bin/psql -p5432 -U prohouzing -d prohouzing_db -c "SELECT 'OK';" 2>/dev/null | grep -q OK; then
  echo "✅ PostgreSQL đang chạy"
else
  echo "❌ PostgreSQL OFFLINE → Mở Postgres.app và bấm Start!"
  open -a "Postgres"
  sleep 3
fi

echo ""
echo "🚀 Khởi động FastAPI tại http://localhost:8002"
echo "   📖 Swagger UI: http://localhost:8002/api/docs"
echo ""

# Mở browser sau 3 giây
(sleep 3 && open http://localhost:8002/api/docs) &

$PYTHON -m uvicorn prohouzing_server:app \
  --host 0.0.0.0 \
  --port 8002 \
  --reload \
  --log-level info

echo ""
echo "Server đã dừng. Nhấn Enter để đóng."
read
