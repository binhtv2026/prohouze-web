#!/bin/bash
# =====================================================
# deploy-digitalocean.sh
# Setup ProHouzing Backend trên DigitalOcean Droplet
# Chạy 1 lần duy nhất khi tạo server mới
# =====================================================
# Usage:
#   1. Tạo Droplet Ubuntu 22.04 trên DigitalOcean ($12/tháng)
#   2. Copy file này lên server: scp deploy-digitalocean.sh root@IP:/root/
#   3. SSH vào server: ssh root@IP
#   4. chmod +x deploy-digitalocean.sh && ./deploy-digitalocean.sh
# =====================================================

set -e
APP_DIR="/opt/prohouzing"
APP_USER="prohouzing"
DOMAIN="${DOMAIN:-api.prohouzing.com}"  # Set env var hoặc sửa trực tiếp
GITHUB_REPO="https://github.com/binhtv2026/prohouzing-web.git"

echo ""
echo "🚀 ProHouzing — DigitalOcean Setup"
echo "===================================="
echo "  Server: $(hostname -I | awk '{print $1}')"
echo "  Domain: $DOMAIN"
echo ""

# ─── 1. System update ────────────────────────────────────────────────────────
echo "── Step 1: System Update ───────────────────────────"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
  python3 python3-pip python3-venv git curl \
  nginx certbot python3-certbot-nginx \
  ufw htop unzip
echo "  ✅ System packages installed"

# ─── 2. Firewall ─────────────────────────────────────────────────────────────
echo "── Step 2: Firewall ────────────────────────────────"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "  ✅ UFW firewall configured (SSH + HTTP + HTTPS)"

# ─── 3. App user ─────────────────────────────────────────────────────────────
echo "── Step 3: App User ────────────────────────────────"
id "$APP_USER" &>/dev/null || useradd -r -s /bin/bash -m "$APP_USER"
echo "  ✅ User: $APP_USER"

# ─── 4. Clone repo ───────────────────────────────────────────────────────────
echo "── Step 4: Clone Repository ────────────────────────"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$GITHUB_REPO" "$APP_DIR"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
echo "  ✅ Code at $APP_DIR"

# ─── 5. Python virtualenv + dependencies ─────────────────────────────────────
echo "── Step 5: Python Environment ──────────────────────"
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
pip install -q gunicorn uvicorn[standard] psutil
deactivate
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/backend/venv"
echo "  ✅ Python venv + dependencies installed"

# ─── 6. Environment file ─────────────────────────────────────────────────────
echo "── Step 6: Environment Variables ───────────────────"
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cat > "$APP_DIR/backend/.env" << 'ENV'
ENV=production
PORT=8000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SECRET_KEY=change-this-to-random-string-in-production
ALLOWED_ORIGINS=https://prohouzing.com,https://prohouzing-web.vercel.app
ENV
  chmod 600 "$APP_DIR/backend/.env"
  echo "  ⚠️  Created .env — PHẢI điền giá trị thật!"
  echo "     nano $APP_DIR/backend/.env"
else
  echo "  ✅ .env already exists"
fi

# ─── 7. Systemd service ──────────────────────────────────────────────────────
echo "── Step 7: Systemd Service ─────────────────────────"
cat > /etc/systemd/system/prohouzing.service << SERVICE
[Unit]
Description=ProHouzing FastAPI Backend
After=network.target
Wants=network-online.target

[Service]
Type=notify
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/venv/bin/gunicorn server:app \\
    --workers 2 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 0.0.0.0:8000 \\
    --timeout 120 \\
    --keepalive 5 \\
    --max-requests 1000 \\
    --access-logfile /var/log/prohouzing/access.log \\
    --error-logfile /var/log/prohouzing/error.log \\
    --log-level info
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

mkdir -p /var/log/prohouzing
chown "$APP_USER":"$APP_USER" /var/log/prohouzing
systemctl daemon-reload
systemctl enable prohouzing
systemctl start prohouzing
sleep 3
systemctl is-active prohouzing && echo "  ✅ prohouzing.service running" || echo "  ❌ Service failed — check: journalctl -u prohouzing -n 20"

# ─── 8. Nginx reverse proxy ───────────────────────────────────────────────────
echo "── Step 8: Nginx Config ────────────────────────────"
cat > /etc/nginx/sites-available/prohouzing << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Health check (no auth)
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # GZIP
        gzip on;
        gzip_types application/json text/plain;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/prohouzing /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  ✅ Nginx configured"

# ─── 9. SSL Certificate (Let's Encrypt) ──────────────────────────────────────
echo "── Step 9: SSL Certificate ──────────────────────────"
echo "  Chạy sau khi domain đã trỏ về IP này:"
echo "     certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@prohouzing.com"
echo ""
echo "  Hoặc chạy ngay nếu DNS đã config:"
read -p "  DNS đã trỏ về server này? (yes/no): " DNS_READY
if [ "$DNS_READY" = "yes" ]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
    -m "admin@prohouzing.com" \
    --redirect \
    && echo "  ✅ SSL configured" \
    || echo "  ⚠️  SSL failed — thử lại sau khi DNS propagate"
fi

# ─── 10. Deploy script ───────────────────────────────────────────────────────
cat > /usr/local/bin/prohouzing-deploy << 'DEPLOY'
#!/bin/bash
# Quick update script — chạy sau mỗi push code mới
set -e
APP_DIR="/opt/prohouzing"
echo "🔄 Deploying ProHouzing..."
cd "$APP_DIR" && git pull origin main
cd "$APP_DIR/backend" && source venv/bin/activate && pip install -q -r requirements.txt && deactivate
systemctl restart prohouzing
sleep 2
systemctl is-active prohouzing && echo "✅ Deployed OK" || echo "❌ Deploy failed"
DEPLOY
chmod +x /usr/local/bin/prohouzing-deploy

# ─── Summary ──────────────────────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ ProHouzing Backend DEPLOYED"
echo ""
echo "  Server IP:  $SERVER_IP"
echo "  API URL:    http://$SERVER_IP:8000"
echo "  API URL:    https://$DOMAIN (sau khi SSL)"
echo ""
echo "  📋 Việc cần làm tiếp:"
echo "  1. Điền .env thật:  nano $APP_DIR/backend/.env"
echo "  2. Restart:         systemctl restart prohouzing"
echo "  3. Xem logs:        journalctl -u prohouzing -f"
echo "  4. Update code:     prohouzing-deploy"
echo "  5. Vercel env:      REACT_APP_BACKEND_URL=https://$DOMAIN"
echo "══════════════════════════════════════════════════════"
echo ""
