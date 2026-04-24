#!/bin/bash
# ProHouzing Backend Startup Script (Local Dev)
# Chạy sau khi đã cài đủ dependencies

set -e

BASE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE"

echo "======================================"
echo "  ProHouzing Backend - Local Start"
echo "======================================"

# Kiểm tra POSTGRES
PSQL="/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
echo "▶ Kiểm tra PostgreSQL..."
$PSQL -p5432 -U prohouzing -d prohouzing_db -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null && \
  echo "✅ PostgreSQL OK" || \
  echo "❌ PostgreSQL KHÔNG KẾT NỐI ĐƯỢC - Kiểm tra Postgres.app đang Running"

# Kiểm tra pip deps
echo ""
echo "▶ Kiểm tra Python dependencies..."
python3 -c "import fastapi, sqlalchemy, psycopg2, uvicorn; print('✅ Core deps OK')" 2>/dev/null || \
  echo "⚠️  Thiếu deps - Chạy: pip3 install --user -r requirements.txt"

# Chạy server
echo ""
echo "▶ Khởi động FastAPI Backend tại http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

export PATH="$HOME/Library/Python/3.9/bin:$PATH"
python3 -m uvicorn server:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --log-level info
