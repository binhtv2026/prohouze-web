#!/bin/bash
# =====================================================
# add-to-existing-droplet.sh
# Thêm ProHouzing backend vào Droplet đang chạy
# Server: 168.144.40.178 (ubuntu-s-1vcpu-2gb-sgp1)
# Chạy: ssh root@168.144.40.178 và paste vào
# =====================================================

set -e

APP_DIR="/opt/prohouzing"
APP_USER="prohouzing"
APP_PORT="8001"   # Dùng 8001 để tránh conflict với app khác
REPO="https://github.com/binhtv2026/prohouzing-web.git"

echo "🚀 ProHouzing — Add to Existing Droplet"
echo "========================================"
echo "  Port: $APP_PORT"
echo ""

# ─── 1. Cài thêm packages còn thiếu ─────────────────
echo "── Packages ─────────────────────────────────────"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git certbot python3-certbot-nginx
echo "  ✅ Done"

# ─── 2. Tạo user & clone ──────────────────────────────
echo "── Clone ProHouzing ────────────────────────────"
id "$APP_USER" &>/dev/null || useradd -r -s /bin/bash -m "$APP_USER"

if [ -d "$APP_DIR" ]; then
  echo "  → Đã có, git pull..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
echo "  ✅ Code at $APP_DIR"

# ─── 3. Python venv ──────────────────────────────────
echo "── Python Environment ──────────────────────────"
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
pip install -q "gunicorn" "uvicorn[standard]" "psutil"
deactivate
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/backend/venv"
echo "  ✅ venv ready"

# ─── 4. .env file ────────────────────────────────────
echo "── Environment File ────────────────────────────"
if [ ! -f "$APP_DIR/backend/.env" ]; then
cat > "$APP_DIR/backend/.env" << 'ENV'
ENV=production
PORT=8001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SECRET_KEY=prohouzing-secret-change-this
ALLOWED_ORIGINS=https://prohouzing.com,https://prohouzing-web.vercel.app,http://168.144.40.178
ENV
  chmod 600 "$APP_DIR/backend/.env"
  echo "  ⚠️  .env tạo xong — cần điền SUPABASE_URL + KEY thật"
  echo "     Sửa: nano $APP_DIR/backend/.env"
else
  echo "  ✅ .env đã tồn tại"
fi

# ─── 5. Systemd service ───────────────────────────────
echo "── Systemd Service ─────────────────────────────"
cat > /etc/systemd/system/prohouzing.service << SERVICE
[Unit]
Description=ProHouzing API
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/venv/bin/gunicorn server:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$APP_PORT \
    --timeout 120 \
    --max-requests 1000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable prohouzing
systemctl restart prohouzing
sleep 3
systemctl is-active prohouzing \
  && echo "  ✅ prohouzing.service RUNNING on port $APP_PORT" \
  || (echo "  ❌ Service lỗi — xem log:" && journalctl -u prohouzing -n 30 && exit 1)

# ─── 6. Test nội bộ ──────────────────────────────────
echo "── Internal Test ───────────────────────────────"
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT/health || echo "000")
[ "$STATUS" = "200" ] && echo "  ✅ /health → HTTP $STATUS" || echo "  ⚠️  /health → HTTP $STATUS (server còn khởi động)"

# ─── 7. Nginx virtual host ────────────────────────────
echo "── Nginx Config ────────────────────────────────"
cat > /etc/nginx/sites-available/prohouzing << 'NGINX'
server {
    listen 80;
    server_name api.prohouzing.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/prohouzing /etc/nginx/sites-enabled/prohouzing
nginx -t && systemctl reload nginx
echo "  ✅ Nginx: api.prohouzing.com → :8001"

# ─── 8. UFW (nếu đang bật) ───────────────────────────
ufw status | grep -q "Status: active" && ufw allow 80/tcp && ufw allow 443/tcp && echo "  ✅ UFW: 80/443 allowed" || true

# ─── Summary ─────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ ProHouzing Backend READY"
echo ""
echo "  Test ngay:"
echo "  curl http://168.144.40.178:$APP_PORT/health"
echo "  curl http://168.144.40.178:$APP_PORT/version"
echo ""
echo "  📋 Việc còn lại:"
echo "  1. nano $APP_DIR/backend/.env → điền Supabase"
echo "  2. systemctl restart prohouzing"
echo "  3. Trỏ DNS: api.prohouzing.com → 168.144.40.178"
echo "  4. SSL: certbot --nginx -d api.prohouzing.com"
echo "  5. Vercel env: REACT_APP_BACKEND_URL=http://168.144.40.178:$APP_PORT"
echo "══════════════════════════════════════════════════"
