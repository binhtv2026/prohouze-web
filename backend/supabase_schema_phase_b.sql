-- ==========================================
-- ProHouzing — Supabase SQL Schema
-- Phase B: Secondary + Leasing + HR Dev
-- Run này trong Supabase SQL Editor
-- ==========================================

-- B1: SECONDARY SALES TABLES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secondary_listings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code            TEXT UNIQUE NOT NULL,
  project         TEXT NOT NULL,
  block           TEXT,
  floor           INTEGER,
  unit            TEXT,
  area            NUMERIC(8, 2),
  bedrooms        INTEGER DEFAULT 2,
  direction       TEXT,
  original_price  BIGINT,
  listing_price   BIGINT NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'negotiating', 'sold', 'withdrawn')),
  agent_id        TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_name      TEXT,
  views           INTEGER DEFAULT 0,
  inquiries       INTEGER DEFAULT 0,
  legal_status    TEXT DEFAULT 'sổ hồng',
  images          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secondary_listings_status ON secondary_listings(status);
CREATE INDEX IF NOT EXISTS idx_secondary_listings_agent ON secondary_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_secondary_listings_project ON secondary_listings USING gin(to_tsvector('simple', project));

CREATE TABLE IF NOT EXISTS secondary_deals (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id      TEXT REFERENCES secondary_listings(id) ON DELETE SET NULL,
  project         TEXT NOT NULL,
  buyer_name      TEXT NOT NULL,
  buyer_phone     TEXT NOT NULL,
  seller_name     TEXT NOT NULL,
  seller_phone    TEXT NOT NULL,
  agreed_price    BIGINT,
  stage           TEXT DEFAULT 'initial' CHECK (stage IN ('initial', 'site_visit', 'negotiation', 'legal_check', 'deposit', 'completed', 'cancelled')),
  commission_pct  NUMERIC(4, 2) DEFAULT 1.5,
  commission_value BIGINT,
  agent_id        TEXT,
  agent_name      TEXT,
  expected_close  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secondary_deals_stage ON secondary_deals(stage);
CREATE INDEX IF NOT EXISTS idx_secondary_deals_agent ON secondary_deals(agent_id);

-- B2: LEASING TABLES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leasing_assets (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code            TEXT UNIQUE NOT NULL,
  project         TEXT NOT NULL,
  block           TEXT,
  unit            TEXT NOT NULL,
  area            NUMERIC(8, 2),
  bedrooms        INTEGER DEFAULT 2,
  status          TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')),
  monthly_rent    BIGINT NOT NULL,
  owner_name      TEXT,
  owner_phone     TEXT,
  agent_id        TEXT,
  images          TEXT[] DEFAULT '{}',
  amenities       TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leasing_assets_status ON leasing_assets(status);

CREATE TABLE IF NOT EXISTS lease_contracts (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  asset_id        TEXT REFERENCES leasing_assets(id) ON DELETE SET NULL,
  asset_code      TEXT NOT NULL,
  tenant_name     TEXT NOT NULL,
  tenant_phone    TEXT NOT NULL,
  tenant_email    TEXT,
  tenant_id_card  TEXT,
  monthly_rent    BIGINT NOT NULL,
  deposit         BIGINT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  payment_date    INTEGER DEFAULT 5, -- ngày thanh toán hàng tháng
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'terminated')),
  renewal_count   INTEGER DEFAULT 0,
  agent_id        TEXT,
  signed_at       TIMESTAMPTZ,
  terminated_at   TIMESTAMPTZ,
  termination_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_contracts_status ON lease_contracts(status);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_end_date ON lease_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_lease_contracts_asset ON lease_contracts(asset_id);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  asset_id        TEXT REFERENCES leasing_assets(id) ON DELETE SET NULL,
  asset_code      TEXT NOT NULL,
  type            TEXT NOT NULL, -- electrical, plumbing, hvac, structural, appliance, other
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
  reported_by     TEXT,
  assigned_to     TEXT,
  estimated_cost  BIGINT,
  actual_cost     BIGINT,
  resolution_note TEXT,
  images          TEXT[] DEFAULT '{}',
  reported_at     TIMESTAMPTZ DEFAULT NOW(),
  assigned_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_tickets(asset_id);

CREATE TABLE IF NOT EXISTS lease_invoices (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id     TEXT REFERENCES lease_contracts(id) ON DELETE SET NULL,
  asset_code      TEXT NOT NULL,
  tenant_name     TEXT NOT NULL,
  month           TEXT NOT NULL, -- YYYY-MM
  rent_amount     BIGINT NOT NULL,
  utilities       BIGINT DEFAULT 0,
  other_fees      BIGINT DEFAULT 0,
  total           BIGINT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  due_date        DATE NOT NULL,
  paid_at         TIMESTAMPTZ,
  payment_method  TEXT,
  payment_ref     TEXT,
  auto_generated  BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, month)
);

CREATE INDEX IF NOT EXISTS idx_lease_invoices_status ON lease_invoices(status);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_month ON lease_invoices(month);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_contract ON lease_invoices(contract_id);

-- B3: HR DEVELOPMENT TABLES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_career_progress (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL UNIQUE,
  track           TEXT DEFAULT 'primary' CHECK (track IN ('primary', 'secondary', 'leasing', 'support')),
  current_level   TEXT NOT NULL DEFAULT 'sales_trainee',
  next_level      TEXT,
  progress_pct    INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  criteria_met    JSONB DEFAULT '[]',
  promoted_at     TIMESTAMPTZ,
  promoted_by     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_user ON hr_career_progress(user_id);

CREATE TABLE IF NOT EXISTS hr_badges (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL,
  badge           TEXT NOT NULL,
  icon            TEXT,
  label           TEXT,
  description     TEXT,
  awarded_by      TEXT DEFAULT 'system',
  earned_at       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON hr_badges(user_id);

CREATE TABLE IF NOT EXISTS hr_competition_results (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  period_type     TEXT NOT NULL CHECK (period_type IN ('week', 'month', 'quarter', 'half', 'year')),
  period_label    TEXT NOT NULL, -- 'W16-2026', '2026-04', 'Q2-2026'...
  user_id         TEXT NOT NULL,
  rank            INTEGER NOT NULL,
  deals           INTEGER DEFAULT 0,
  revenue         BIGINT DEFAULT 0,
  progress_pct    NUMERIC(5, 2),
  rewarded        BOOLEAN DEFAULT FALSE,
  reward_value    BIGINT,
  reward_note     TEXT,
  finalized_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_type, period_label, user_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_period ON hr_competition_results(period_type, period_label);
CREATE INDEX IF NOT EXISTS idx_competition_user ON hr_competition_results(user_id);

CREATE TABLE IF NOT EXISTS hr_training_enrollment (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL,
  course_id       TEXT NOT NULL,
  course_title    TEXT NOT NULL,
  department      TEXT,
  level           TEXT, -- basic, intermediate, advanced
  progress        INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  score           INTEGER, -- quiz score if applicable
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_training_user ON hr_training_enrollment(user_id);
CREATE INDEX IF NOT EXISTS idx_training_course ON hr_training_enrollment(course_id);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Bật RLS cho các bảng nhạy cảm
ALTER TABLE secondary_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_career_progress ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ xem được data của mình (override cho admin/manager)
CREATE POLICY "Users see own career progress" ON hr_career_progress
  FOR SELECT USING (user_id = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'manager', 'bod'));

CREATE POLICY "Users see own badges" ON hr_badges
  FOR SELECT USING (user_id = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'manager', 'bod'));

-- Policy: agents xem listings của mình, manager xem tất cả
CREATE POLICY "Agents see own listings" ON secondary_listings
  FOR SELECT USING (agent_id = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'manager', 'bod'));

-- Policy: agents xem contracts của mình, manager xem tất cả
CREATE POLICY "Agents see own contracts" ON lease_contracts
  FOR SELECT USING (agent_id = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'manager', 'bod', 'leasing_manager'));

-- ─── Functions & Triggers ─────────────────────────────────────────────────────
-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER secondary_listings_updated_at BEFORE UPDATE ON secondary_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lease_contracts_updated_at BEFORE UPDATE ON lease_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leasing_assets_updated_at BEFORE UPDATE ON leasing_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hr_career_updated_at BEFORE UPDATE ON hr_career_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto flag contracts expiring soon (run via cron or on SELECT)
CREATE OR REPLACE FUNCTION flag_expiring_contracts()
RETURNS void AS $$
BEGIN
  UPDATE lease_contracts
  SET status = 'expiring_soon'
  WHERE status = 'active'
    AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ─── Supabase Storage Buckets ─────────────────────────────────────────────────
-- Run via Supabase Dashboard > Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('listing-media', 'listing-media', true),
--   ('lease-documents', 'lease-documents', false),
--   ('hr-files', 'hr-files', false);
