-- =====================================================
-- supabase_migration_phase_f.sql — F1
-- Production Database Migration
-- Run on: Supabase SQL Editor (as project owner)
-- =====================================================

-- ─── Indexes for performance ──────────────────────────────────────────────────
-- Run if not already created from Phase B schema
CREATE INDEX IF NOT EXISTS idx_lease_contracts_status      ON lease_contracts(status);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_end_date    ON lease_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_tenant      ON lease_contracts(tenant_name);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_contract     ON lease_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_status       ON lease_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_due          ON lease_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_secondary_listings_status   ON secondary_listings(status);
CREATE INDEX IF NOT EXISTS idx_secondary_listings_project  ON secondary_listings(project_name);
CREATE INDEX IF NOT EXISTS idx_secondary_deals_stage       ON secondary_deals(stage);
CREATE INDEX IF NOT EXISTS idx_hr_career_user              ON hr_career_records(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread   ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user             ON audit_logs(user_id, created_at DESC);

-- ─── Notifications table (for E3 push + realtime) ─────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type         VARCHAR(60) NOT NULL,
  title        VARCHAR(200),
  message      TEXT,
  data         JSONB DEFAULT '{}',
  is_read      BOOLEAN DEFAULT false,
  sent_via     VARCHAR(20) DEFAULT 'in_app', -- in_app | push | email
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit log table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id),
  action       VARCHAR(100) NOT NULL,
  table_name   VARCHAR(60),
  record_id    TEXT,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FCM device tokens ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_tokens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token    TEXT NOT NULL UNIQUE,
  platform     VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app_version  VARCHAR(20),
  is_active    BOOLEAN DEFAULT true,
  last_seen    TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Supabase Realtime — enable tables ────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE lease_contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE secondary_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE hr_competition_results;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens   ENABLE ROW LEVEL SECURITY;

-- Notifications: user xem thông báo của mình
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Audit logs: chỉ admin xem
CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Device tokens: user quản lý token của mình
CREATE POLICY "device_tokens_own" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ─── Functions ────────────────────────────────────────────────────────────────
-- Auto mark contracts as expiring_soon
CREATE OR REPLACE FUNCTION auto_flag_expiring_contracts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE lease_contracts
  SET status = 'expiring_soon'
  WHERE status = 'active'
    AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days';
END;
$$;

-- Function tạo thông báo tự động
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  notif_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notif_id;
  RETURN notif_id;
END;
$$;

-- Trigger: Auto notify khi HĐ sắp hết hạn được flag
CREATE OR REPLACE FUNCTION notify_contract_expiring()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'expiring_soon' AND OLD.status = 'active' THEN
    PERFORM create_notification(
      NULL, -- broadcast to all
      'contract_expiring_30d',
      '⚠️ Hợp đồng sắp hết hạn',
      'HĐ ' || NEW.asset_code || ' của ' || NEW.tenant_name || ' hết hạn ngày ' || NEW.end_date::DATE::TEXT,
      jsonb_build_object('contract_id', NEW.id, 'asset_code', NEW.asset_code)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_contract_expiring ON lease_contracts;
CREATE TRIGGER trg_notify_contract_expiring
  AFTER UPDATE OF status ON lease_contracts
  FOR EACH ROW EXECUTE FUNCTION notify_contract_expiring();

-- ─── Performance: Analyze tables ─────────────────────────────────────────────
ANALYZE lease_contracts;
ANALYZE secondary_listings;
ANALYZE notifications;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC
LIMIT 15;

SELECT '✅ Phase F Migration Complete' as status, NOW() as timestamp;
