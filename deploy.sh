#!/bin/bash
# deploy.sh — ProHouzing Production Deploy Script
# Sử dụng: ./deploy.sh [backend|frontend|all]
# Default: all

set -e

VPS="root@168.144.40.178"
REMOTE_DIR="/opt/prohouzing"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

TARGET="${1:-all}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ProHouzing Deploy — $TIMESTAMP  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Git status ──────────────────────────────────────────
echo "📦 Syncing code to VPS..."
rsync -azq \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='frontend/build' \
  --exclude='backend/__pycache__' \
  --exclude='backend/*.pyc' \
  --exclude='backend/venv' \
  --exclude='backend/uploads/*' \
  "$LOCAL_DIR/" "$VPS:$REMOTE_DIR/"

echo "✅ Code synced"

# ── Step 2: Deploy target ───────────────────────────────────────
if [[ "$TARGET" == "backend" ]]; then
  echo "🔄 Restarting backend only..."
  ssh "$VPS" "
    systemctl restart prohouzing 2>/dev/null && echo '✅ prohouzing service restarted' || \
    (cd $REMOTE_DIR && docker compose restart backend && echo '✅ Docker backend restarted')
  "

elif [[ "$TARGET" == "frontend" ]]; then
  echo "🔨 Rebuilding frontend container..."
  ssh "$VPS" "
    cd $REMOTE_DIR
    docker compose build --no-cache frontend
    docker compose up -d frontend
    echo '✅ Frontend rebuilt and started'
  "

else
  # Deploy ALL
  echo "🔄 Deploying all services..."
  ssh "$VPS" "
    cd $REMOTE_DIR

    # Check if backend is systemd or docker
    if systemctl is-active prohouzing &>/dev/null; then
      echo '→ Restarting systemd backend...'
      systemctl restart prohouzing
      echo '✅ Backend restarted'
    fi

    # Rebuild and restart docker containers (frontend + nginx)
    if docker ps | grep -q prohouzing_frontend; then
      echo '→ Rebuilding Docker frontend...'
      docker compose build frontend
      docker compose up -d --no-deps frontend
      echo '✅ Frontend rebuilt'
    elif docker compose config &>/dev/null 2>&1; then
      echo '→ Starting Docker services...'
      docker compose up -d --build
      echo '✅ All Docker services started'
    fi
  "
fi

# ── Step 3: Health check ────────────────────────────────────────
echo ""
echo "🩺 Health check..."
sleep 3

BACKEND_STATUS=$(ssh "$VPS" "curl -s http://localhost:8002/api/status 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get(\"status\",\"ERR\"), \"|\", d.get(\"routers_mounted\",0), \"routers\")' 2>/dev/null" || echo "unreachable")

echo "  Backend: $BACKEND_STATUS"

FRONTEND_STATUS=$(ssh "$VPS" "docker ps --filter name=prohouzing_frontend --format '{{.Status}}' 2>/dev/null || echo 'not running'")
echo "  Frontend: ${FRONTEND_STATUS:-not running}"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ✅ Deploy complete!                 ║"
echo "║  Backend:  https://api.prohouzing.com║"
echo "║  Frontend: https://prohouzing.com    ║"
echo "╚══════════════════════════════════════╝"
echo ""
