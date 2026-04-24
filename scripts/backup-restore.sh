#!/bin/bash
# =====================================================
# backup-restore.sh — F9
# ProHouzing Backup & Disaster Recovery
# =====================================================

set -e
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/$TIMESTAMP"
SUPABASE_URL="${SUPABASE_DB_URL:-postgresql://postgres:password@db.xxx.supabase.co:5432/postgres}"

echo "💾 ProHouzing Backup & Disaster Recovery"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# ─── BACKUP ───────────────────────────────────────────────────────────────────
if [ "$1" = "backup" ] || [ -z "$1" ]; then
  echo "── Creating Backup ──────────────────────────────────"
  mkdir -p "$BACKUP_DIR"

  # 1. Supabase DB dump (requires psql + pg_dump)
  if command -v pg_dump &>/dev/null && [ -n "$SUPABASE_DB_URL" ]; then
    echo "  📦 Dumping database..."
    pg_dump "$SUPABASE_URL" \
      --no-owner --no-acl \
      --compress=9 \
      -f "$BACKUP_DIR/prohouzing_db_$TIMESTAMP.sql.gz" \
      && echo "  ✅ Database dumped" \
      || echo "  ⚠️  pg_dump failed — backup Supabase manually"
  else
    echo "  ⚠️  pg_dump/SUPABASE_DB_URL not set — manual backup required"
    echo "     Supabase Dashboard → Settings → Database → Backups"
  fi

  # 2. Frontend config backup
  echo "  📋 Backing up configs..."
  cp -f "frontend/capacitor.config.json" "$BACKUP_DIR/" 2>/dev/null || true
  cp -f "vercel.json"                    "$BACKUP_DIR/" 2>/dev/null || true
  cp -f ".env.store"                     "$BACKUP_DIR/" 2>/dev/null || true

  # 3. Backup summary
  cat > "$BACKUP_DIR/backup_manifest.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "version": "2.1.0",
  "git_hash": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "git_tag": "$(git describe --tags --abbrev=0 2>/dev/null || echo 'unknown')",
  "files": $(ls "$BACKUP_DIR" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip().split('\n')))")
}
EOF

  echo ""
  echo "  ✅ Backup complete: $BACKUP_DIR"
  ls -lh "$BACKUP_DIR"
fi

# ─── ROLLBACK ─────────────────────────────────────────────────────────────────
if [ "$1" = "rollback" ]; then
  PREV_TAG="${2:-v1.0-phase-e}"
  echo "── Rollback to $PREV_TAG ───────────────────────────"
  echo "  ⚠️  This will revert code to $PREV_TAG"
  read -p "  Confirm rollback? (yes/no): " CONFIRM
  [ "$CONFIRM" != "yes" ] && echo "Cancelled." && exit 0

  git fetch --tags
  git checkout "$PREV_TAG"
  echo "  ✅ Code rolled back to $PREV_TAG"
  echo "  → Rebuild and redeploy manually"
  echo "     cd frontend && npm run build"
  echo "     vercel --prod"
fi

# ─── STATUS ───────────────────────────────────────────────────────────────────
if [ "$1" = "status" ]; then
  echo "── Backup History ───────────────────────────────────"
  ls -lh backups/ 2>/dev/null | tail -10 || echo "  No backups found"
  echo ""
  echo "── Git Tags ─────────────────────────────────────────"
  git tag -l "v1.0-*" | sort -r | head -10
fi

echo ""
echo "Usage: $0 [backup|rollback <tag>|status]"
