#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ProHouzing - VPS Deploy Script
# Chạy lệnh này trên VPS Ubuntu 22.04 sau khi upload source lên
# ═══════════════════════════════════════════════════════════════
set -e

DOMAIN="prohouzing.com"
API_DOMAIN="api.prohouzing.com"
EMAIL="admin@prohouzing.com"   # Email cho certbot
APP_DIR="/opt/prohouzing"

echo "======================================"
echo "  ProHouzing VPS Setup & Deploy"
echo "======================================"

# ─── 1. Cài Docker ───────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "📦 Cài Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
echo "✅ Docker: $(docker --version)"

# ─── 2. Cài Docker Compose ───────────────────────────────────
if ! command -v docker-compose &>/dev/null; then
  curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi
echo "✅ Docker Compose: $(docker-compose --version)"

# ─── 3. Tạo thư mục SSL cho Nginx ────────────────────────────
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/nginx/certbot/www

# ─── 4. Cấu hình JWT Secret ngẫu nhiên ──────────────────────
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
sed -i "s/CHANGE_THIS_TO_A_RANDOM_64_CHAR_SECRET_BEFORE_DEPLOY/$JWT_SECRET/" $APP_DIR/backend/.env.production
echo "✅ JWT Secret đã được generate"

# ─── 5. Build và start containers ────────────────────────────
cd $APP_DIR
echo "🏗️  Building Docker images..."
docker compose build

echo "🚀 Starting services..."
docker compose up -d postgres
sleep 10  # Chờ postgres healthy

docker compose up -d backend
sleep 5

docker compose up -d frontend nginx
echo "✅ Tất cả services đang chạy"
docker compose ps

# ─── 6. Lấy SSL Certificate từ Let's Encrypt ─────────────────
echo ""
echo "🔐 Lấy SSL certificate..."
# Dừng nginx để certbot standalone hoạt động (hoặc dùng webroot)
docker compose stop nginx

docker run --rm \
  -v $APP_DIR/nginx/ssl:/etc/letsencrypt \
  -v $APP_DIR/nginx/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN \
  -d $API_DOMAIN

echo "✅ SSL certificate đã lấy thành công"

# Khởi động lại nginx với SSL
docker compose start nginx

echo ""
echo "======================================"
echo "  ✅ ProHouzing đã deploy thành công!"
echo "======================================"
echo "  🌐 Website: https://$DOMAIN"
echo "  ⚙️  API:     https://$API_DOMAIN"
echo "  📖 Docs:    https://$API_DOMAIN/docs"
echo "======================================"
