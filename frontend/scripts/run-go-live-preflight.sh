#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$(cd "$FRONTEND_DIR/../backend" && pwd)"

echo "[1/5] Audit canonical permissions"
python3 "$BACKEND_DIR/scripts/audit_canonical_permissions.py"

echo "[2/5] Audit foundation assets"
python3 "$BACKEND_DIR/scripts/audit_foundation_assets.py"

echo "[3/5] Audit active routes"
cd "$FRONTEND_DIR"
npm run audit:routes

echo "[4/5] Run role and session flows"
npm run test:role-flows -- --runInBand

echo "[5/5] Build production bundle"
npm run build

echo "PASS: go-live preflight completed"
